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

function normalizeString(str) {
    return str?.toLowerCase().trim() || '';
}

function normalizeArray(arr) {
    return arr?.map(item => normalizeString(item)) || [];
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

    // Normalize the input data
    const normalizedDrill = {
        ...drill,
        skill_level: normalizeArray(drill.skill_level),
        complexity: normalizeString(drill.complexity),
        skills_focused_on: normalizeArray(drill.skills_focused_on),
        positions_focused_on: normalizeArray(drill.positions_focused_on),
        // ... other fields remain the same
    };

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
                normalizedDrill.skill_level,
                normalizedDrill.complexity,
                suggested_length,
                number_of_people_min,
                number_of_people_max,
                normalizedDrill.skills_focused_on,
                normalizedDrill.positions_focused_on,
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
        await updateSkills(normalizedDrill.skills_focused_on, drillId);
        
        return json(result.rows[0]);
    } catch (error) {
        console.error('Error occurred while inserting drill:', error);
        return json({ error: 'An error occurred while creating the drill', details: error.toString() }, { status: 500 });
    }
};

export const GET = async (event) => {
  const session = await event.locals.getSession();
  const userId = session?.user?.id;
  
  const url = new URL(event.request.url);
  const page = parseInt(url.searchParams.get('page')) || 1;
  const limit = parseInt(url.searchParams.get('limit')) || 9;
  
  console.log('API received request:', {
    page,
    limit,
    allParams: Object.fromEntries(url.searchParams.entries())
  });

  // Get filter and sort parameters
  const skillLevels = url.searchParams.getAll('skillLevel[]');
  const complexities = url.searchParams.getAll('complexity[]');
  const skillsFocused = url.searchParams.getAll('skillsFocused[]');
  const positionsFocused = url.searchParams.getAll('positionsFocused[]');
  const hasVideo = url.searchParams.get('hasVideo') === 'true';
  const hasDiagrams = url.searchParams.get('hasDiagrams') === 'true';
  const hasImages = url.searchParams.get('hasImages') === 'true';
  const searchQuery = url.searchParams.get('search')?.toLowerCase();
  const sortOption = url.searchParams.get('sort');
  const sortOrder = url.searchParams.get('order') || 'asc';

  // Build WHERE clause
  const conditions = [];
  const params = [userId];
  let paramCount = 1;

  // Base visibility condition
  conditions.push(`(visibility = 'public' OR visibility = 'unlisted' OR (visibility = 'private' AND created_by = $${paramCount}))`);

  // Add filter conditions
  if (skillLevels.length > 0) {
    paramCount++;
    params.push(skillLevels);
    conditions.push(`skill_level @> $${paramCount}`);
  }

  if (complexities.length > 0) {
    paramCount++;
    params.push(complexities);
    conditions.push(`complexity = ANY($${paramCount})`);
  }

  if (skillsFocused.length > 0) {
    paramCount++;
    params.push(skillsFocused);
    conditions.push(`skills_focused_on && $${paramCount}`);
  }

  if (positionsFocused.length > 0) {
    paramCount++;
    params.push(positionsFocused);
    conditions.push(`positions_focused_on && $${paramCount}`);
  }

  if (hasVideo) {
    conditions.push('video_link IS NOT NULL');
  }

  if (hasDiagrams) {
    conditions.push('diagrams IS NOT NULL AND array_length(diagrams, 1) > 0');
  }

  if (hasImages) {
    conditions.push('images IS NOT NULL AND array_length(images, 1) > 0');
  }

  if (searchQuery) {
    paramCount++;
    params.push(`%${searchQuery}%`);
    conditions.push(`(
      LOWER(name) LIKE $${paramCount} OR 
      LOWER(brief_description) LIKE $${paramCount} OR 
      LOWER(detailed_description) LIKE $${paramCount}
    )`);
  }

  const whereClause = conditions.length > 0 
    ? 'WHERE ' + conditions.join(' AND ') 
    : '';

  try {
    // If no pagination parameters are provided, return all drills
    if (url.searchParams.get('page') === null && url.searchParams.get('limit') === null) {
      const result = await client.query(`
        SELECT d.*,
               (SELECT COUNT(*) FROM drills v WHERE v.parent_drill_id = d.id) as variation_count
        FROM drills d
        ${whereClause}
        ORDER BY date_created DESC
      `, params);

      return json({ drills: result.rows });
    }

    // Handle paginated request
    const offset = (page - 1) * limit;

    // Get total count with filters
    const countResult = await client.query(`
      SELECT COUNT(*) 
      FROM drills d
      ${whereClause}
    `, params);
    
    const totalCount = parseInt(countResult.rows[0].count);
    console.log('Total count:', totalCount);

    // Add pagination parameters
    params.push(limit, offset);

    console.log('Executing paginated query:', {
      whereClause,
      params,
      limit,
      offset
    });

    // Get paginated results
    const result = await client.query(`
      SELECT d.*,
             (SELECT COUNT(*) FROM drills v WHERE v.parent_drill_id = d.id) as variation_count
      FROM drills d
      ${whereClause}
      ORDER BY date_created DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `, params);

    console.log('Query results:', {
      resultCount: result.rows.length,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit)
      }
    });

    return json({
      drills: result.rows,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
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
    

    try {
        // Check if the drill exists first
        const { rows } = await client.query(
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
            const existingSkillsResult = await client.query('SELECT skills_focused_on FROM drills WHERE id = $1', [id]);
            const existingSkills = existingSkillsResult.rows[0].skills_focused_on;

            // Update the drill
            const result = await client.query(
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
    } catch (error) {
        console.error('Error checking drill ownership:', error);
        return json({ error: 'An error occurred while checking drill ownership', details: error.toString() }, { status: 500 });
    }
});
