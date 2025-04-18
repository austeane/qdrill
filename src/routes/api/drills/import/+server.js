import { json } from '@sveltejs/kit';
import pkg from 'pg';
const { Pool } = pkg;
import { v4 as uuidv4 } from 'uuid';
import { authGuard } from '$lib/server/authGuard';

// Initialize PostgreSQL pool using environment variables
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL, // Ensure this is correctly set in your environment
  ssl: {
    rejectUnauthorized: false
  }
});

export const POST = authGuard(async ({ request, locals }) => {
  console.log("Received request to import drills...");
  const session = locals.session;
  const userId = session?.user?.id;

  try {
    const { drills, fileName, visibility = 'public' } = await request.json();

    if (!Array.isArray(drills) || drills.length === 0) {
      return json({ error: 'No drills provided for import' }, { status: 400 });
    }

    // Generate a unique upload_source ID
    const uploadSource = `${fileName}_${Date.now()}_${uuidv4()}`;

    // Begin transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const insertPromises = drills.map(drill => {
        const {
          name,
          brief_description,
          detailed_description,
          skill_level,
          complexity,
          suggested_length,
          number_of_people,
          skills_focused_on,
          positions_focused_on,
          video_link,
          images,
          diagrams
        } = drill;

        // Process diagrams
        let processedDiagrams = diagrams;

        // Ensure diagrams is an array
        if (!Array.isArray(processedDiagrams)) {
          processedDiagrams = diagrams ? [diagrams] : [];
        }

        // Stringify each diagram object for storage in the database
        processedDiagrams = processedDiagrams.map(diagram => JSON.stringify(diagram));

        return client.query(
          `INSERT INTO drills (
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
            upload_source,
            created_by,
            visibility,
            is_editable_by_others
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
          )`,
          [
            name,
            brief_description,
            detailed_description || null,
            skill_level,
            complexity || null,
            `${suggested_length.min}-${suggested_length.max}`,
            number_of_people.min || 0,
            number_of_people.max || 99,
            skills_focused_on,
            positions_focused_on,
            video_link || null,
            images || [],
            processedDiagrams,
            uploadSource,
            userId,
            visibility,
            false
          ]
        );
      });

      await Promise.all(insertPromises);
      await client.query('COMMIT');

      return json({ importedCount: drills.length, uploadSource }, { status: 200 });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error importing drills:', error);
      return json({ error: 'Failed to import drills', details: error.toString() }, { status: 500 });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error processing import request:', error);
    return json({ error: 'Invalid request payload', details: error.toString() }, { status: 400 });
  }
});
