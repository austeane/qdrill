import { json } from '@sveltejs/kit';
import pkg from 'pg';
const { Pool } = pkg;

// Initialize PostgreSQL pool using environment variables
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL, // Use POSTGRES_URL from .env.development.local
  ssl: {
    rejectUnauthorized: false
  }
});

export async function POST({ request }) {
  try {
    const { drills } = await request.json();

    if (!Array.isArray(drills) || drills.length === 0) {
      return json({ error: 'No drills provided for import' }, { status: 400 });
    }

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
            diagrams
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
          )`,
          [
            name,
            brief_description,
            detailed_description || null,
            skill_level,
            complexity ? complexity.toString() : null,
            `${suggested_length.min}-${suggested_length.max}`,
            number_of_people.min || 0,
            number_of_people.max || 99,
            skills_focused_on,
            positions_focused_on,
            video_link || null,
            images || [],
            processedDiagrams
          ]
        );
      });

      await Promise.all(insertPromises);
      await client.query('COMMIT');

      return json({ importedCount: drills.length }, { status: 200 });
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
}
