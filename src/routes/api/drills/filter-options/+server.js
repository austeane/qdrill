import { json } from '@sveltejs/kit';
import * as db from '$lib/server/db';

export async function GET() {
    try {
        // Get distinct skill levels with case normalization
        const skillLevelsQuery = `
            SELECT DISTINCT LOWER(TRIM(UNNEST(skill_level))) as value
            FROM drills
            WHERE array_length(skill_level, 1) > 0
            ORDER BY value;
        `;

        // Get distinct complexities with case normalization
        const complexitiesQuery = `
            SELECT DISTINCT LOWER(TRIM(complexity)) as value
            FROM drills
            WHERE complexity IS NOT NULL
            ORDER BY value;
        `;

        // Get distinct skills focused on with case normalization
        const skillsFocusedQuery = `
            SELECT DISTINCT LOWER(TRIM(UNNEST(skills_focused_on))) as value
            FROM drills
            WHERE array_length(skills_focused_on, 1) > 0
            ORDER BY value;
        `;

        // Get distinct positions focused on with case normalization
        const positionsFocusedQuery = `
            SELECT DISTINCT LOWER(TRIM(UNNEST(positions_focused_on))) as value
            FROM drills
            WHERE array_length(positions_focused_on, 1) > 0
            ORDER BY value;
        `;

        // Get distinct drill types with case normalization
        const drillTypesQuery = `
            SELECT DISTINCT LOWER(TRIM(UNNEST(drill_type))) as value
            FROM drills
            WHERE array_length(drill_type, 1) > 0
            ORDER BY value;
        `;

        // Execute all queries in parallel
        const [
            skillLevelsResult,
            complexitiesResult,
            skillsFocusedResult,
            positionsFocusedResult,
            drillTypesResult
        ] = await Promise.all([
            db.query(skillLevelsQuery),
            db.query(complexitiesQuery),
            db.query(skillsFocusedQuery),
            db.query(positionsFocusedQuery),
            db.query(drillTypesQuery)
        ]);

        // Get min/max for number of people
        const peopleRangeQuery = `
            SELECT 
                MIN(number_of_people_min) as min_people,
                MAX(number_of_people_max) as max_people
            FROM drills
            WHERE number_of_people_min IS NOT NULL
            OR number_of_people_max IS NOT NULL;
        `;
        const peopleRangeResult = await db.query(peopleRangeQuery);

        // Process the results (simplified since normalization is done in SQL)
        const processResults = rows => rows
            .map(row => {
                let value = row.value;
                // Handle potential JSON strings
                if (typeof value === 'string' && value.startsWith('{')) {
                    try {
                        const parsed = JSON.parse(value);
                        value = parsed.skill.toLowerCase().trim();
                    } catch (e) {
                        // If parsing fails, use original value
                    }
                }
                return value;
            })
            .filter(Boolean)
            .sort();

        return json({
            skillLevels: processResults(skillLevelsResult.rows),
            complexities: processResults(complexitiesResult.rows),
            skillsFocusedOn: processResults(skillsFocusedResult.rows),
            positionsFocusedOn: processResults(positionsFocusedResult.rows),
            drillTypes: processResults(drillTypesResult.rows),
            numberOfPeopleOptions: {
                min: peopleRangeResult.rows[0]?.min_people || 0,
                max: peopleRangeResult.rows[0]?.max_people || 100
            },
            suggestedLengths: {
                min: 0,
                max: 120
            }
        });
    } catch (error) {
        console.error('Error fetching filter options:', error);
        return json({ error: 'Failed to fetch filter options' }, { status: 500 });
    }
} 