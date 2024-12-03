import { json } from '@sveltejs/kit';
import * as db from '$lib/server/db';
import { authGuard } from '$lib/server/authGuard';

async function updateSkills(skills, drillId) {
  for (const skill of skills) {
    await db.query(
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

function normalizeString(str) {
  return str?.toLowerCase().trim() || '';
}

function normalizeArray(arr) {
  return arr?.map(item => normalizeString(item)) || [];
}

export async function GET({ url }) {
  const page = parseInt(url.searchParams.get('page')) || 1;
  const limit = parseInt(url.searchParams.get('limit')) || 10;
  const all = url.searchParams.get('all') === 'true';
  const sortOption = url.searchParams.get('sort');
  const sortOrder = url.searchParams.get('order') || 'desc';

  // Calculate offset for pagination
  const offset = (page - 1) * limit;

  let conditions = [];
  let queryParams = [];
  let paramCount = 0;

  // Build ORDER BY clause
  let orderBy = '';
  if (sortOption) {
    orderBy = `ORDER BY ${sortOption} ${sortOrder}, d.id ${sortOrder}`;
  } else {
    // Apply default sort by date_created DESC when no sort option is specified
    orderBy = 'ORDER BY date_created DESC, d.id DESC';
  }

  // Build the final query
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  
  let query;
  let countQuery;
  
  if (all) {
    query = `
      SELECT d.*,
             (SELECT COUNT(*) FROM drills v WHERE v.parent_drill_id = d.id) as variation_count
      FROM drills d
      ${whereClause}
      ${orderBy}
    `;
  } else {
    countQuery = `
      SELECT COUNT(*)
      FROM drills d
      ${whereClause}
    `;
    
    query = `
      SELECT d.*,
             (SELECT COUNT(*) FROM drills v WHERE v.parent_drill_id = d.id) as variation_count
      FROM drills d
      ${whereClause}
      ${orderBy}
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;
  }

  try {
    let drills;
    let pagination = {};

    if (!all) {
      const countResult = await db.query(countQuery, queryParams);
      const totalItems = parseInt(countResult.rows[0].count);
      pagination = {
        page: parseInt(page),
        limit: parseInt(limit),
        totalItems,
        totalPages: Math.ceil(totalItems / limit)
      };

      // Add pagination parameters for the main query
      queryParams = [...queryParams, limit, offset];
    }

    const result = await db.query(query, queryParams);
    drills = result.rows;

    return json({
      drills,
      pagination: all ? null : pagination
    });
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
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

  // Normalize inputs
  if (!Array.isArray(diagrams)) {
    diagrams = diagrams ? [diagrams] : [];
  }
  diagrams = diagrams.map(diagram => JSON.stringify(diagram));

  if (typeof skill_level === 'string') skill_level = [skill_level];
  if (typeof skills_focused_on === 'string') skills_focused_on = [skills_focused_on];
  if (typeof positions_focused_on === 'string') positions_focused_on = [positions_focused_on];
  if (!Array.isArray(images)) images = [];
  if (typeof drill_type === 'string') drill_type = [drill_type];

  const normalizedDrill = {
    ...drill,
    skill_level: normalizeArray(skill_level),
    complexity: normalizeString(complexity),
    skills_focused_on: normalizeArray(skills_focused_on),
    positions_focused_on: normalizeArray(positions_focused_on),
  };

  try {
    const result = await db.query(
      `INSERT INTO drills (
        name, brief_description, detailed_description, skill_level, complexity,
        suggested_length, number_of_people_min, number_of_people_max, skills_focused_on,
        positions_focused_on, video_link, images, diagrams, drill_type,
        created_by, is_editable_by_others, visibility
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING id`,
      [name, brief_description, detailed_description, normalizedDrill.skill_level,
       normalizedDrill.complexity, suggested_length, number_of_people_min,
       number_of_people_max, normalizedDrill.skills_focused_on,
       normalizedDrill.positions_focused_on, video_link, images, diagrams,
       drill_type, userId, is_editable_by_others, visibility]
    );
    
    const drillId = result.rows[0].id;
    await updateSkills(normalizedDrill.skills_focused_on, drillId);
    
    return json(result.rows[0]);
  } catch (error) {
    console.error('Error occurred while inserting drill:', error);
    return json({ error: 'An error occurred while creating the drill', details: error.toString() }, { status: 500 });
  }
};

export const PUT = authGuard(async ({ request, locals }) => {
    const drill = await request.json();
    const session = await locals.getSession();
    const userId = session.user.id;
    const { id } = drill;
    
    try {
        // Check if the drill exists first
        const { rows } = await db.query(
            `SELECT created_by, is_editable_by_others FROM drills WHERE id = $1`,
            [id]
        );

        if (!rows || rows.length === 0) {
            console.error('Drill not found:', id);
            return json({ error: 'Drill not found' }, { status: 404 });
        }

        const drillData = rows[0];

        // Modified authorization check:
        // Allow edit if:
        // 1. User created the drill (created_by matches userId)
        // 2. Drill is editable by others (is_editable_by_others is true)
        // 3. Drill has no creator (created_by is null) - this allows claiming ownership
        if (drillData.created_by !== userId && !drillData.is_editable_by_others && drillData.created_by !== null) {
            return json({ error: 'Unauthorized' }, { status: 403 });
        }

        // If drill has no creator, assign it to the current user
        let created_by = drillData.created_by;
        if (created_by === null) {
            created_by = userId;
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

        // Only convert empty string to null for number_of_people_max
        number_of_people_max = number_of_people_max === '' ? null : parseInt(number_of_people_max) || null;

        try {
            // First, get the existing skills for this drill
            const existingSkillsResult = await db.query(
                'SELECT skills_focused_on FROM drills WHERE id = $1',
                [id]
            );
            const existingSkills = existingSkillsResult.rows[0].skills_focused_on;

            // Update the drill
            const result = await db.query(
                `UPDATE drills SET 
                 name = $2, brief_description = $3, detailed_description = $4, skill_level = $5, 
                 complexity = $6, suggested_length = $7, number_of_people_min = $8, number_of_people_max = $9, 
                 skills_focused_on = $10, positions_focused_on = $11, video_link = $12, images = $13, diagrams = $14, drill_type = $15,
                 is_editable_by_others = $16, visibility = $17, created_by = $18
                 WHERE id = $1 RETURNING *`,
                [id, name, brief_description, detailed_description, skill_level, complexity, suggested_length, 
                 number_of_people_min, number_of_people_max, skills_focused_on, positions_focused_on, video_link, images, diagrams, drill_type,
                 is_editable_by_others, visibility, created_by]
            );

            // Update skills
            const skillsToRemove = existingSkills.filter(skill => !skills_focused_on.includes(skill));
            const skillsToAdd = skills_focused_on.filter(skill => !existingSkills.includes(skill));

            // Remove skills no longer used in this drill
            for (const skill of skillsToRemove) {
                await db.query(
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
    } catch (error) {
        console.error('Error checking drill ownership:', error);
        return json({ error: 'An error occurred while checking drill ownership', details: error.toString() }, { status: 500 });
    }
});

export const DELETE = authGuard(async ({ params, locals }) => {
    const drillId = params.drillId;
    const session = await locals.getSession();
    const userId = session.user.id;

    try {
        // Check if the drill exists and if the user has permission to delete it
        const { rows } = await db.query(
            `SELECT created_by FROM drills WHERE id = $1`,
            [drillId]
        );

        if (!rows || rows.length === 0) {
            return json({ error: 'Drill not found' }, { status: 404 });
        }

        const drill = rows[0];

        // Only allow deletion if the user created the drill
        if (drill.created_by !== userId) {
            return json({ error: 'Unauthorized' }, { status: 403 });
        }

        // Delete the drill
        await db.query(
            `DELETE FROM drills WHERE id = $1`,
            [drillId]
        );

        return json({ message: 'Drill deleted successfully' });
    } catch (error) {
        console.error('Error deleting drill:', error);
        return json({ error: 'An error occurred while deleting the drill' }, { status: 500 });
    }
});
