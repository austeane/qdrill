import { json } from '@sveltejs/kit';
import { parse } from 'csv-parse/sync';

export async function POST({ request }) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return json({ error: 'No file uploaded' }, { status: 400 });
    }

    const csvContent = await file.text();
    const records = parse(csvContent, { columns: true, skip_empty_lines: true });

    const parsedDrills = [];
    let validDrills = 0;
    let drillsWithErrors = 0;

    for (const [index, record] of records.entries()) {
      const drill = parseDrill(record);
      if (drill.errors.length === 0) {
        validDrills++;
      } else {
        drillsWithErrors++;
        drill.row = index + 2; // Assuming header is row 1
      }
      parsedDrills.push(drill);
    }

    return json({
      summary: {
        total: records.length,
        valid: validDrills,
        errors: drillsWithErrors
      },
      drills: parsedDrills
    });
  } catch (error) {
    console.error('Error processing bulk upload:', error);
    return json({ error: 'Failed to process bulk upload', details: error.toString() }, { status: 500 });
  }
}

function parseDrill(record) {
  const drill = {
    name: record['Name'],
    brief_description: record['Brief Description'],
    detailed_description: record['Detailed Description'],
    skill_level: parseArray(record['Skill Level']).map(Number),
    complexity: record['Complexity'] ? Number(record['Complexity']) : null,
    suggested_length: {
      min: parseInteger(record['Suggested Length Min']),
      max: parseInteger(record['Suggested Length Max'])
    },
    number_of_people: {
      min: parseInteger(record['Number of People Min']),
      max: parseInteger(record['Number of People Max'])
    },
    skills_focused_on: parseArray(record['Skills Focused On']),
    positions_focused_on: parseArray(record['Positions Focused On']),
    video_link: record['Video Link'],
    diagrams: parseDiagrams(record['Diagrams']),
    errors: []
  };

  validateDrill(drill);
  return drill;
}

function parseDiagrams(diagramsString) {
  if (!diagramsString) return [];
  try {
    const diagrams = JSON.parse(diagramsString);
    return Array.isArray(diagrams) ? diagrams : [diagrams];
  } catch (error) {
    console.error('Error parsing diagrams:', error);
    return [];
  }
}

function parseArray(value = '') {
  return value.split(',').map(item => item.trim());
}

function parseInteger(value) {
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? null : parsed;
}

function validateDrill(drill) {
  drill.errors = [];

  // 1. Name: Required
  if (!drill.name || drill.name.trim() === '') {
    drill.errors.push('Name is required');
  }

  // 2. Brief Description: Required
  if (!drill.brief_description || drill.brief_description.trim() === '') {
    drill.errors.push('Brief description is required');
  }

  // 3. Skill Level: Required, array of numbers [1-5]
  if (!Array.isArray(drill.skill_level) || drill.skill_level.length === 0) {
    drill.errors.push('Skill level is required and must be an array of numbers');
  } else {
    const validSkillLevels = [1, 2, 3, 4, 5];
    const invalidLevels = drill.skill_level.filter(
      (level) => !validSkillLevels.includes(level)
    );
    if (invalidLevels.length > 0) {
      drill.errors.push(`Invalid skill levels: ${invalidLevels.join(', ')}`);
    }
  }

  // 4. Complexity: Optional, must be 1, 2, or 3
  if (drill.complexity !== null) {
    const validComplexities = [1, 2, 3];
    if (!validComplexities.includes(drill.complexity)) {
      drill.errors.push('Complexity must be 1 (Low), 2 (Medium), or 3 (High)');
    }
  }

  // 5. Suggested Length: Required, positive integers, max >= min
  const { min: minLength, max: maxLength } = drill.suggested_length;
  if (!Number.isInteger(minLength) || minLength <= 0) {
    drill.errors.push('Suggested length min must be a positive integer');
  }
  if (!Number.isInteger(maxLength) || maxLength <= 0) {
    drill.errors.push('Suggested length max must be a positive integer');
  }
  if (maxLength < minLength) {
    drill.errors.push('Suggested length max must be greater than or equal to min');
  }

  // 6. Number of People: Optional, positive integers, max >= min
  const { min: minPeople, max: maxPeople } = drill.number_of_people;
  if (minPeople !== null || maxPeople !== null) {
    if (minPeople !== null && (!Number.isInteger(minPeople) || minPeople <= 0)) {
      drill.errors.push('Number of people min must be a positive integer');
    }
    if (maxPeople !== null && (!Number.isInteger(maxPeople) || maxPeople <= 0)) {
      drill.errors.push('Number of people max must be a positive integer');
    }
    if (maxPeople !== null && minPeople !== null && maxPeople < minPeople) {
      drill.errors.push('Number of people max must be greater than or equal to min');
    }
  }

  // 7. Skills Focused On: Required, must be an array
  if (!Array.isArray(drill.skills_focused_on) || drill.skills_focused_on.length === 0) {
    drill.errors.push('Skills focused on is required and must be an array');
  }

  // 8. Positions Focused On: Required, valid positions
  const validPositions = ['Beater', 'Chaser', 'Keeper', 'Seeker'];
  if (
    !Array.isArray(drill.positions_focused_on) ||
    drill.positions_focused_on.length === 0
  ) {
    drill.errors.push('Positions focused on is required and must be an array');
  } else {
    const invalidPositions = drill.positions_focused_on.filter(
      (pos) => !validPositions.includes(pos)
    );
    if (invalidPositions.length > 0) {
      drill.errors.push(`Invalid positions: ${invalidPositions.join(', ')}`);
    }
  }

  // 9. Video Link: Optional, must be a valid URL if provided
  if (drill.video_link) {
    try {
      new URL(drill.video_link);
    } catch {
      drill.errors.push('Video link must be a valid URL');
    }
  }
}